import { DesignDocument } from "@/lib/design-loader";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { AdminBookingsEnhancer } from "@/components/admin-bookings-enhancer";

type DesignRendererProps = {
  document: DesignDocument;
  pathname: string;
  withSidebar: boolean;
};

export function DesignRenderer({ document, pathname, withSidebar }: DesignRendererProps) {
  const bodyClass = document.bodyClass || "";
  return (
    <>
      <AdminAuthGuard pathname={pathname} />
      <AdminBookingsEnhancer pathname={pathname} />
      {document.styles.map((style, index) => (
        <style
          key={`inline-style-${index}`}
          dangerouslySetInnerHTML={{ __html: style }}
        />
      ))}
      {document.radiusOverrideCss ? (
        <style dangerouslySetInnerHTML={{ __html: document.radiusOverrideCss }} />
      ) : null}
      {withSidebar ? (
        <div className={bodyClass}>
          <AdminSidebar pathname={pathname} />
          <div
            className="lg:pl-72"
            dangerouslySetInnerHTML={{ __html: document.bodyHtml }}
          />
        </div>
      ) : (
        <div
          className={bodyClass || undefined}
          dangerouslySetInnerHTML={{ __html: document.bodyHtml }}
        />
      )}
    </>
  );
}
