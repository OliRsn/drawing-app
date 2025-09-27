import { Card, CardBody, CardHeader } from '@heroui/card';
import { Spinner } from '@heroui/react';
import { useAuth } from '@/contexts/AuthContext';
import DefaultLayout from '@/layouts/default';
import { title } from '@/components/primitives';

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-full">
          <Spinner size="lg" />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <section className="py-2">
        <div className="text-3xl font-bold mb-6 text-center">
          <h1 className={title()}>Profile</h1>
        </div>
        <div className="flex justify-center">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <h2 className="text-xl font-semibold text-center">Your Information</h2>
            </CardHeader>
            <CardBody>
              {user ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Username</p>
                    <p className="font-semibold">{user.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Role</p>
                    <p className="font-semibold">{user.is_admin ? 'Admin' : 'User'}</p>
                  </div>
                </div>
              ) : (
                <p>You are not logged in.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </section>
    </DefaultLayout>
  );
}
