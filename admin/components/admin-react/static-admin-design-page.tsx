import { DesignRenderer } from "@/components/design-renderer";
import { loadDesignDocument } from "@/lib/design-loader";

type StaticAdminDesignPageProps = {
  file: string;
  pathname: string;
  withSidebar: boolean;
};

export async function StaticAdminDesignPage({
  file,
  pathname,
  withSidebar,
}: StaticAdminDesignPageProps) {
  const document = await loadDesignDocument(file, withSidebar);
  return <DesignRenderer document={document} pathname={pathname} withSidebar={withSidebar} />;
}

