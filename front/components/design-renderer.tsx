import { DesignDocument } from "@/lib/design-loader";
import { FrontNavBar } from "@/components/front-nav-bar";
import { resolveFrontNavConfig } from "@/lib/front-nav-config";
import { BookingJourneyEnhancer } from "@/components/booking-journey-enhancer";
import { BookingValidateEnhancer } from "@/components/booking-validate-enhancer";
import { BookingConfirmEnhancer } from "@/components/booking-confirm-enhancer";
import { BookingSuccessEnhancer } from "@/components/booking-success-enhancer";
import { WorkshopLinkEnhancer } from "@/components/workshop-link-enhancer";

type DesignRendererProps = {
  document: DesignDocument;
  pathname: string;
};

export function DesignRenderer({ document, pathname }: DesignRendererProps) {
  const navConfig = resolveFrontNavConfig(pathname);
  const enableBookingJourneyEnhancer =
    pathname === "/booking/calendar" || pathname === "/booking";
  const enableBookingValidateEnhancer = pathname === "/booking/validate";
  const enableBookingConfirmEnhancer = pathname === "/booking/confirm";
  const enableBookingSuccessEnhancer = pathname === "/booking/success";
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
      <FrontNavBar pathname={pathname} config={navConfig} />
      <div
        className={document.bodyClass || undefined}
        dangerouslySetInnerHTML={{ __html: document.bodyHtml }}
      />
      <BookingJourneyEnhancer enabled={enableBookingJourneyEnhancer} />
      <BookingValidateEnhancer enabled={enableBookingValidateEnhancer} />
      <BookingConfirmEnhancer enabled={enableBookingConfirmEnhancer} />
      <BookingSuccessEnhancer enabled={enableBookingSuccessEnhancer} />
      <WorkshopLinkEnhancer pathname={pathname} />
    </>
  );
}
