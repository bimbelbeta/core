import { ArrowLeftIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TiptapRenderer } from "@/components/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/utils/orpc";
import { EditQuestionForm } from "./-components/edit-question-form";
import { type } from "arktype";
import Loader from "@/components/loader";

export const Route = createFileRoute("/admin/questions/$questionId")({
  component: QuestionDetailPage,
  params: {
    parse: type({
      questionId: "number",
    }).assert,
  },
});

function QuestionDetailPage() {
  const { questionId: id } = Route.useParams();
  const [isEditing, setIsEditing] = useState(false);

  const { data, isPending, error } = useQuery(
    orpc.admin.tryout.questions.getQuestion.queryOptions({
      input: { id },
    }),
  );

  if (isPending) {
    return <Loader />;
  }

  if (error || !data) {
    return <div className="p-6 text-red-500">Gagal memuat soal: {error?.message ?? "Data tidak ditemukan"}</div>;
  }

  const { question, choices } = data;

  if (isEditing) {
    return (
      <EditQuestionForm
        question={{
          id: question.id,
          type: question.type,
          content: question.content as object,
          discussion: question.discussion as object,
          tags: question.tags ?? undefined,
        }}
        choices={choices ?? []}
        onSuccess={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <h1 className="font-bold text-2xl text-primary-navy-900">Detail Soal</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          <PencilSimpleIcon className="mr-2 size-4" />
          Edit
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informasi Soal #{question.id}</CardTitle>
              <Badge variant={question.type === "multiple_choice" ? "default" : "secondary"}>
                {question.type === "multiple_choice" ? "Pilihan Ganda" : "Esai"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 font-medium text-muted-foreground text-sm">Konten Soal</h3>
              <TiptapRenderer content={question.content} className="prose prose-sm max-w-none rounded-md border p-4" />
            </div>

            {question.type === "multiple_choice" && choices && (
              <div>
                <h3 className="mb-2 font-medium text-muted-foreground text-sm">Pilihan Jawaban</h3>
                <div className="space-y-3">
                  {choices.map((choice) => (
                    <div
                      key={choice.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${choice.isCorrect ? "border-green-200 bg-green-50" : ""
                        }`}
                    >
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full border font-bold text-xs ${choice.isCorrect
                            ? "border-green-600 bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {choice.code}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{choice.content}</p>
                      </div>
                      {choice.isCorrect && (
                        <Badge variant="outline" className="ml-auto border-green-200 bg-green-100 text-green-700">
                          Benar
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {question.discussion && (
              <div>
                <h3 className="mb-2 font-medium text-muted-foreground text-sm">Pembahasan</h3>
                <TiptapRenderer
                  content={question.discussion}
                  className="prose prose-sm max-w-none rounded-md border bg-muted/30 p-4"
                />
              </div>
            )}

            {question.tags && question.tags.length > 0 && (
              <div>
                <h3 className="mb-2 font-medium text-muted-foreground text-sm">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
