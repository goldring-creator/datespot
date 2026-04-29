interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80'
  const ghostStyle = 'bg-[#F0E4FF] border border-[rgba(170,96,204,0.3)] text-brand-muted'
  const gradientStyle = variant === 'primary'
    ? { background: 'linear-gradient(90deg,#AA60CC,#DC6EA0)', boxShadow: '0 4px 14px rgba(170,96,204,0.35)' }
    : {}

  return (
    <button
      className={`${base} ${variant === 'primary' ? 'text-white' : ghostStyle} ${className}`}
      style={gradientStyle}
      {...props}
    />
  )
}
