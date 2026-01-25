import { XIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createClientOnlyFn } from "@tanstack/react-start";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

const TIME_ELAPSED_BEFORE_SHOWING_AGAIN = 1000 * 60 * 60 * 24 * 1; // 1 days

const saveToStorage = createClientOnlyFn((key: string, data: string) => {
  localStorage.setItem(key, data);
});

const getFromStorage = createClientOnlyFn((key: string) => {
  return localStorage.getItem(key);
});

export function TargetSelectionDialog() {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const dismissedAt = getFromStorage("target-dialog-dismissed");
      if (!dismissedAt) return true;

      const lastDismissed = new Date(dismissedAt);
      const now = new Date();

      return true;
      return now.getTime() - lastDismissed.getTime() > TIME_ELAPSED_BEFORE_SHOWING_AGAIN;
    } catch {
      return true;
    }
  });

  const setMutation = useMutation(
    orpc.userSettings.set.mutationOptions({
      onSuccess: () => {
        toast.success("Target berhasil disimpan!");
        setOpen(false);
      },
      onError: (error: Error) => {
        toast.error(error.message || "Gagal menyimpan target");
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      universityId: null as number | null,
      studyProgramId: null as number | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.universityId || !value.studyProgramId) {
        toast.error("Mohon pilih universitas dan program studi");
        return;
      }
      setMutation.mutate({
        universityId: value.universityId,
        studyProgramId: value.studyProgramId,
      });
    },
  });

  const { data: universities, isPending } = useQuery(orpc.university.list.queryOptions({ input: {} }));
  const { data: universityDetail } = useQuery(
    orpc.university.find.queryOptions({
      input: { id: form.state.values.universityId ?? 0 },
      enabled: form.state.values.universityId !== null,
    }),
  );

  const handleClose = () => {
    setOpen(false);
    saveToStorage("target-dialog-dismissed", new Date().toISOString());
  };

  console.log("universities: ", universities);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={true}
        className="max-h-[85vh] overflow-y-auto"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle>Set Target Universitas Kamu</DialogTitle>
          <DialogDescription>
            Pilih universitas dan program studi yang kamu incar. Data ini akan membantumu memantau perkembangan
            belajarmu.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <form.Field
            name="universityId"
            validators={{
              onChange: type("number"),
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Universitas</Label>
                <Select
                  value={field.state.value?.toString() ?? ""}
                  onValueChange={(value) => {
                    field.handleChange(Number.parseInt(value, 10));
                    form.setFieldValue("studyProgramId", null);
                  }}
                  disabled={isPending || (universities?.data && universities.data.length < 1)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih universitas" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities?.data?.map((uni) => (
                      <SelectItem key={uni.id} value={uni.id.toString()}>
                        {uni.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {universities?.data && universities.data.length < 1 && (
                  <p className="text-destructive text-xs">Belum ada data Universitas. Silahkan coba lagi nanti</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="studyProgramId"
            validators={{
              onChange: type("number"),
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Program Studi</Label>
                <Select
                  value={field.state.value?.toString() ?? ""}
                  onValueChange={(value) => field.handleChange(Number.parseInt(value, 10))}
                  disabled={!universityDetail}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!universityDetail ? "Pilih universitas dulu" : "Pilih program studi"} />
                  </SelectTrigger>
                  <SelectContent>
                    {universityDetail?.studyPrograms?.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {universityDetail?.studyPrograms && universityDetail.studyPrograms.length < 1 && (
                  <p className="text-destructive text-xs">
                    Belum ada data Program Studi untuk Universitas ini. Silahkan coba lagi nanti
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleClose} className="sm:w-auto">
              Nanti aja
            </Button>
            <form.Subscribe>
              {(state) => (
                <Button
                  type="submit"
                  className={cn("sm:w-auto", setMutation.isPending && "cursor-not-allowed")}
                  disabled={!state.canSubmit}
                >
                  {setMutation.isPending ? (
                    <>
                      <Spinner />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
