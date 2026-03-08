import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import * as m from "motion/react-m";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { orpc } from "@/utils/orpc";
import { AccessCodeInput } from "./access-code-input";
import { CreditOption } from "./credit-option";
import { UploadPaymentProof } from "./upload-payment-proof";

interface TryoutStartConfirmationProps {
  children: React.ReactNode;
  disabled?: boolean;
}

type DialogStep = "notice" | "submit-url" | "premium";

export function TryoutStartConfirmation({ children, disabled = false }: TryoutStartConfirmationProps) {
  const { session } = useRouteContext({ from: "/_authenticated" });
  const isPremium = session?.user.isPremium;

  const { data } = useQuery(orpc.tryout.featured.queryOptions());
  const creditBalanceQuery = useQuery(orpc.credit.balance.queryOptions());

  const hasCredits = (creditBalanceQuery.data?.balance ?? 0) > 0;

  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<DialogStep>(isPremium ? "premium" : "notice");
  const router = useRouter();

  const startTryoutMutation = useMutation(
    orpc.tryout.start.mutationOptions({
      onSuccess: () => {
        setIsOpen(false);
        creditBalanceQuery.refetch();
        if (data) {
          if (data.id) router.navigate({ to: "/tryout/$tryoutId", params: { tryoutId: data.id.toString() } });
        }
      },
    }),
  );
  if (!data) return null;

  const handleStart = () => {
    setErrors(null);
    if (isPremium) {
      startTryoutMutation.mutate({ id: data.id });
    } else {
      if (!uploadedUrl) {
        setErrors("Silakan upload bukti pembayaran terlebih dahulu");
        return;
      }
      startTryoutMutation.mutate({ id: data.id, imageUrl: uploadedUrl });
    }
  };

  const handleStartWithCredit = () => {
    setErrors(null);
    startTryoutMutation.mutate({ id: data.id, useCredit: true });
  };

  const handleStartWithAccessCode = (code: string) => {
    setErrors(null);
    startTryoutMutation.mutate({ id: data.id, accessCode: code });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setStep(isPremium ? "premium" : "notice");
      setUploadedUrl(null);
      setErrors(null);
    }
  };

  const handleTryoutGratis = () => {
    setStep("submit-url");
  };

  const handleBeliPaket = () => {
    setIsOpen(false);
    router.navigate({ to: "/premium" });
  };

  const handleUploadComplete = (url: string) => {
    setUploadedUrl(url);
    setErrors(null);
  };

  const handleUploadError = () => {
    setUploadedUrl(null);
  };

  const startErrorMessage = startTryoutMutation.error?.message;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent>
        {step === "premium" ? (
          <DialogHeader>
            <DialogTitle>Mulai Tryout</DialogTitle>
            <DialogDescription>Kamu siap memulai tryout ini.</DialogDescription>
          </DialogHeader>
        ) : step === "notice" ? (
          <m.div
            key="notice"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <DialogHeader>
              <DialogTitle>Pilih Metode</DialogTitle>
              <DialogDescription>Pilih cara untuk memulai tryout ini.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <CreditOption onUseCredit={handleStartWithCredit} isLoading={startTryoutMutation.isPending} />
              <DialogFooter className="flex flex-col gap-3 sm:flex-col">
                <AccessCodeInput onSubmit={handleStartWithAccessCode} isLoading={startTryoutMutation.isPending} />
                <Button onClick={handleTryoutGratis} variant={hasCredits ? "outline" : "default"} className="w-full">
                  {hasCredits ? "Upload Bukti Pembayaran" : "Tryout Gratis"}
                </Button>
                <Button variant="outline" onClick={handleBeliPaket} className="w-full">
                  Beli Paket
                </Button>
              </DialogFooter>
            </div>
          </m.div>
        ) : (
          <m.div
            key="submit-url"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <DialogHeader>
              <DialogTitle>Upload Bukti Pembayaran</DialogTitle>
              <DialogDescription>
                Untuk melanjutkan, silakan upload bukti pembayaran Anda (maksimal 2MB).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <UploadPaymentProof
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
                onRemove={handleUploadError}
                disabled={startTryoutMutation.isPending}
              />
              {(errors || startErrorMessage) && (
                <p className="text-destructive text-sm">{errors ?? startErrorMessage}</p>
              )}
              <DialogFooter>
                <Button
                  onClick={handleStart}
                  disabled={startTryoutMutation.isPending || !uploadedUrl}
                  className="w-full"
                >
                  {startTryoutMutation.isPending ? "Memproses..." : "Mulai Tryout"}
                </Button>
              </DialogFooter>
            </div>
          </m.div>
        )}
        {step === "premium" && (
          <DialogFooter>
            <Button onClick={handleStart} disabled={startTryoutMutation.isPending} className="w-full">
              {startTryoutMutation.isPending ? (
                <>
                  <Spinner /> Memulai...
                </>
              ) : (
                "Mulai Tryout"
              )}
            </Button>
          </DialogFooter>
        )}
        {step === "notice" && (errors || startErrorMessage) && (
          <p className="text-destructive text-sm">{errors ?? startErrorMessage}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
