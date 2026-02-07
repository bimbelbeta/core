import { ArchiveIcon, BooksIcon, FileTextIcon, RankingIcon, UserIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";

const links = [
  {
    title: "Tryouts",
    description: "Kelola paket tryout dan subtes",
    url: "/admin/tryouts",
    icon: FileTextIcon,
  },
  {
    title: "Questions",
    description: "Bank soal dan manajemen pertanyaan",
    url: "/admin/questions",
    icon: ArchiveIcon,
  },
  {
    title: "Classes",
    description: "Mata pelajaran dan konten belajar",
    url: "/admin/classes",
    icon: BooksIcon,
  },
  {
    title: "Passing Grade",
    description: "Universitas dan program studi",
    url: "/admin/passing-grades",
    icon: RankingIcon,
  },
  {
    title: "Users",
    description: "Manajemen pengguna dan peran",
    url: "/admin/users",
    icon: UserIcon,
  },
] as const;

export function QuickLinks() {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-muted-foreground text-sm">Pintasan</h3>
      <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link key={link.url} to={link.url} className="h-full">
            <Card className="h-full py-2 transition-colors hover:bg-muted/50">
              <CardContent className="flex h-full items-center gap-4 px-2">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <link.icon className="size-5 text-primary" weight="duotone" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{link.title}</p>
                  <p className="text-muted-foreground text-xs">{link.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
