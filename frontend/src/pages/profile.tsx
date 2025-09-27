import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Spinner } from '@heroui/react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { useAuth } from '@/contexts/AuthContext';
import DefaultLayout from '@/layouts/default';
import { title } from '@/components/primitives';
import { updatePassword } from '@/lib/api';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    try {
      await updatePassword(currentPassword, newPassword);
      setSuccessMessage('Mot de passe mis à jour avec succès.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Échec de la mise à jour du mot de passe. Veuillez vérifier votre mot de passe actuel.');
    }
  };

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
          <h1 className={title()}>Profil</h1>
        </div>
        <div className="flex flex-col items-center gap-8">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <h2 className="text-xl font-semibold text-center">Vos Informations</h2>
            </CardHeader>
            <CardBody>
              {user ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Nom d'utilisateur</p>
                    <p className="font-semibold">{user.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Rôle</p>
                    <p className="font-semibold">{user.is_admin ? 'Admin' : 'Utilisateur'}</p>
                  </div>
                </div>
              ) : (
                <p>Vous n'êtes pas connecté.</p>
              )}
            </CardBody>
          </Card>

          <Card className="w-full max-w-sm">
            <CardHeader>
              <h2 className="text-xl font-semibold text-center">Changer le mot de passe</h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Mot de passe actuel"
                  placeholder="Entrez votre mot de passe actuel"
                  type="password"
                  value={currentPassword}
                  onValueChange={setCurrentPassword}
                  required
                />
                <Input
                  label="Nouveau mot de passe"
                  placeholder="Entrez votre nouveau mot de passe"
                  type="password"
                  value={newPassword}
                  onValueChange={setNewPassword}
                  required
                />
                <Input
                  label="Confirmer le nouveau mot de passe"
                  placeholder="Confirmez votre nouveau mot de passe"
                  type="password"
                  value={confirmPassword}
                  onValueChange={setConfirmPassword}
                  required
                />
                {error && <p className="text-danger text-sm">{error}</p>}
                {successMessage && <p className="text-success text-sm">{successMessage}</p>}
                <Button type="submit" color="primary">
                  Changer le mot de passe
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </section>
    </DefaultLayout>
  );
}
