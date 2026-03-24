import { DesignRenderer } from "@/components/design-renderer";
import { loadDesignDocument } from "@/lib/design-loader";

type StaticDesignPageProps = {
  file: string;
  pathname: string;
};

export async function StaticDesignPage({ file, pathname }: StaticDesignPageProps) {
  const document = await loadDesignDocument(file);
  return <DesignRenderer document={document} pathname={pathname} />;
}

