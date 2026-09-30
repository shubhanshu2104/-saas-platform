import Link from "next/link";

type BillingLinkProps = {
  label?: string;
  className?: string;
};

export default function BillingLink({
  label = "BILLING",
  className = "",
}: BillingLinkProps) {
  return (
    <Link
      href="/billing"
      className={`font-semibold tracking-[0.12em] transition hover:opacity-60 ${className}`}
    >
      {label}
    </Link>
  );
}