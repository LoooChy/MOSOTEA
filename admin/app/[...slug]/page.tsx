import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignRenderer } from "@/components/design-renderer";
import { loadDesignDocument } from "@/lib/design-loader";
import { ADMIN_ROUTES, resolveAdminRoute, toPathname } from "@/lib/design-routes";

type Params = {
  slug: string[];
};

type RouteProps = {
  params: Promise<Params>;
};

export async function generateStaticParams() {
  return ADMIN_ROUTES.filter((route) => route.path !== "/").map((route) => ({
    slug: route.path.split("/").filter(Boolean),
  }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const route = resolveAdminRoute(toPathname(slug));
  if (!route) {
    return { title: "Not Found | Moso Tea Admin" };
  }
  return { title: route.label };
}

export default async function AdminDesignPage({ params }: RouteProps) {
  const { slug } = await params;
  const route = resolveAdminRoute(toPathname(slug));
  if (!route || route.path === "/") {
    notFound();
  }

  const withSidebar = route.layout === "admin";
  const document = await loadDesignDocument(route.file, withSidebar);
  return (
    <DesignRenderer
      document={document}
      pathname={route.path}
      withSidebar={withSidebar}
    />
  );
}
