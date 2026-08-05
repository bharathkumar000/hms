import LoginPage from '@/app/[module]/login/page';

export default function AdminLoginPage() {
  // We can just reuse the generic login page component 
  // and pass the params it expects.
  const mockParams = Promise.resolve({ module: 'admin' });
  return <LoginPage params={mockParams} />;
}
