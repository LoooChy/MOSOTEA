import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignRenderer } from "@/components/design-renderer";
import { loadDesignDocument } from "@/lib/design-loader";
import { FRONT_ROUTES, resolveFrontRoute, toPathname } from "@/lib/design-routes";

type Params = {
  slug: string[];
};

type RouteProps = {
  params: Promise<Params>;
};

export async function generateStaticParams() {
  return FRONT_ROUTES.filter((route) => route.path !== "/").map((route) => ({
    slug: route.path.split("/").filter(Boolean),
  }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const route = resolveFrontRoute(toPathname(slug));
  if (!route) {
    return { title: "Not Found | Moso Tea" };
  }
  return { title: route.label };
}

export default async function FrontDesignPage({ params }: RouteProps) {
  const { slug } = await params;
  const route = resolveFrontRoute(toPathname(slug));
  if (!route || route.path === "/") {
    notFound();
  }

  const document = await loadDesignDocument(route.file);
  return <DesignRenderer document={document} pathname={route.path} />;
}
