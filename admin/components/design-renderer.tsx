import { DesignDocument } from "@/lib/design-loader";
import { AdminSidebar } from "@/components/admin-sidebar";

type DesignRendererProps = {
  document: DesignDocument;
  pathname: string;
  withSidebar: boolean;
};

export function DesignRenderer({ document, pathname, withSidebar }: DesignRendererProps) {
  const bodyClass = document.bodyClass || "";
  return (
    <>
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
