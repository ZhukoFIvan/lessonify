import { RegisterForm } from '@/components/auth/register-form'

interface RegisterPageProps {
  searchParams: { invite?: string }
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  return <RegisterForm inviteToken={searchParams.invite} />
}
