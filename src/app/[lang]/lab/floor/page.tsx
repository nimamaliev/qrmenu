import { redirect } from "next/navigation";

// The floor story is the home page now; old preview links land there.
export default async function FloorLab({ params }: PageProps<"/[lang]/lab/floor">) {
  const { lang } = await params;
  redirect(`/${lang}`);
}
