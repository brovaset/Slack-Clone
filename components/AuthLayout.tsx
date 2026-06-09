import Link from "next/link";

export function AuthHero() {
  return (
    <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] bg-[#4A154B] relative overflow-hidden items-center justify-center p-16 shrink-0">
      <div className="absolute inset-0">
        <div className="absolute top-[8%] left-[6%] w-[72px] h-[72px] bg-[#E01E5A] rounded-[12px] rotate-[14deg] opacity-90" />
        <div className="absolute top-[22%] right-[12%] w-[56px] h-[56px] bg-[#36C5F0] rounded-[10px] -rotate-[8deg] opacity-90" />
        <div className="absolute bottom-[28%] left-[14%] w-[64px] h-[64px] bg-[#2EB67D] rounded-[12px] rotate-[32deg] opacity-90" />
        <div className="absolute bottom-[12%] right-[8%] w-[48px] h-[48px] bg-[#ECB22E] rounded-[10px] -rotate-[18deg] opacity-90" />
        <div className="absolute top-[45%] left-[40%] w-[40px] h-[40px] bg-[#E01E5A] rounded-[8px] rotate-[45deg] opacity-60" />
        <div className="absolute bottom-[45%] right-[35%] w-[36px] h-[36px] bg-[#36C5F0] rounded-[8px] -rotate-[20deg] opacity-60" />
      </div>
      <div className="relative z-10 max-w-[400px] text-white">
        <SlackColorLogo className="w-14 h-14 mb-10" />
        <h2 className="text-[42px] font-black leading-[1.1] mb-5 tracking-tight">
          Where work happens
        </h2>
        <p className="text-[20px] leading-[1.5] opacity-95 font-normal">
          Share updates, make decisions, and keep everyone aligned in channels
          built for how you actually work.
        </p>
      </div>
    </div>
  );
}

export function AuthFormWrapper({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-10 bg-white min-h-screen">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8">
          <SlackColorLogo className="w-[44px] h-[44px]" />
        </div>
        <h1 className="text-[28px] font-black text-[#1D1C1D] text-center leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[15px] text-[#616061] text-center mt-3 mb-8 leading-relaxed">
            {subtitle}
          </p>
        )}
        {!subtitle && <div className="mb-8" />}
        {children}
        {footer}
      </div>
    </div>
  );
}

export function AuthSSOButtons({ onSSO }: { onSSO: (provider: string) => void }) {
  return (
    <div className="space-y-3 mb-6">
      <button
        type="button"
        onClick={() => onSSO("google")}
        className="slack-auth-sso"
      >
        <GoogleIcon />
        <span>Sign in with Google</span>
      </button>
      <button
        type="button"
        onClick={() => onSSO("apple")}
        className="slack-auth-sso"
      >
        <AppleIcon />
        <span>Sign in with Apple</span>
      </button>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-[rgba(29,28,29,0.13)]" />
      <span className="text-[12px] font-bold text-[#616061] uppercase tracking-wide">or</span>
      <div className="flex-1 h-px bg-[rgba(29,28,29,0.13)]" />
    </div>
  );
}

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  minLength,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="slack-auth-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className="slack-auth-input"
      />
    </div>
  );
}

export function AuthSubmitButton({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <button type="submit" disabled={loading} className="slack-auth-submit">
      {children}
    </button>
  );
}

export function AuthFooterLink({
  text,
  linkText,
  href,
}: {
  text: string;
  linkText: string;
  href: string;
}) {
  return (
    <p className="mt-8 text-center text-[15px] text-[#616061]">
      {text}{" "}
      <Link href={href} className="text-[#1264A3] hover:underline font-bold">
        {linkText}
      </Link>
    </p>
  );
}

export function AuthHelpLink() {
  return (
    <p className="mt-4 text-center">
      <button
        type="button"
        className="text-[15px] text-[#1264A3] hover:underline font-bold"
        onClick={() => {
          document.dispatchEvent(
            new CustomEvent("slack:toast", {
              detail: "Contact your workspace admin for help signing in.",
            })
          );
        }}
      >
        Can&apos;t sign in?
      </button>
    </p>
  );
}

export function SlackColorLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
        fill="#E01E5A"
      />
      <path
        d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
        fill="#36C5F0"
      />
      <path
        d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"
        fill="#2EB67D"
      />
      <path
        d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
        fill="#ECB22E"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
