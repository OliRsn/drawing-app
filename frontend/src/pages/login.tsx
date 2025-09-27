import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { useAuth } from '@/contexts/AuthContext';
import DefaultLayout from '@/layouts/default';
import { title } from '@/components/primitives';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/profile');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
    }
  };

  return (
    <DefaultLayout>
      <section className="py-2">
        <div className="text-3xl font-bold mb-6 text-center">
          <h1 className={title()}>Login</h1>
        </div>
        <div className="flex justify-center">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <h2 className="text-xl font-semibold text-center">Welcome back</h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Username"
                  placeholder="Enter your username"
                  value={username}
                  onValueChange={setUsername}
                  required
                />
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                  onValueChange={setPassword}
                  required
                />
                {error && <p className="text-danger text-sm">{error}</p>}
                <Button type="submit" color="primary">
                  Log In
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </section>
    </DefaultLayout>
  );
}
