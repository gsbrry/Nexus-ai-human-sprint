'use client';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Loader2, Users, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const profileSetupSchema = z
  .object({
    full_name: z.string().min(2, 'Enter your name').max(80),
    org_action: z.enum(['create', 'join']),
    org_name: z.string().max(80).optional(),
    invite_code: z.string().max(40).optional(),
  })
  .refine((d) => (d.org_action === 'create' ? !!d.org_name && d.org_name.length >= 2 : true), {
    path: ['org_name'],
    message: 'Organisation name required',
  })
  .refine((d) => (d.org_action === 'join' ? !!d.invite_code && d.invite_code.length > 0 : true), {
    path: ['invite_code'],
    message: 'Invite code required',
  });

type ProfileSetupInput = z.infer<typeof profileSetupSchema>;

export function ProfileSetupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [orgAction, setOrgAction] = useState<'create' | 'join'>('create');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: { org_action: 'create' },
  });

  function pickAction(a: 'create' | 'join') {
    setOrgAction(a);
    setValue('org_action', a);
  }

  function onSubmit(data: ProfileSetupInput) {
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/users/profile-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not save profile');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" type="text" autoComplete="name" {...register('full_name')} />
        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Organisation</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => pickAction('create')}
            className={cn(
              'rounded-md border px-3 py-3 text-left transition-colors',
              orgAction === 'create'
                ? 'border-gold/60 bg-gold/10 text-foreground'
                : 'border-border bg-[#0A0A0A] text-muted-foreground hover:text-foreground'
            )}
          >
            <PlusCircle className={cn('size-4 mb-1', orgAction === 'create' ? 'text-gold' : '')} />
            <div className="text-[12px] font-semibold">Create org</div>
            <div className="text-[10px] text-muted-foreground">You’ll be the admin</div>
          </button>
          <button
            type="button"
            onClick={() => pickAction('join')}
            className={cn(
              'rounded-md border px-3 py-3 text-left transition-colors',
              orgAction === 'join'
                ? 'border-gold/60 bg-gold/10 text-foreground'
                : 'border-border bg-[#0A0A0A] text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className={cn('size-4 mb-1', orgAction === 'join' ? 'text-gold' : '')} />
            <div className="text-[12px] font-semibold">Join org</div>
            <div className="text-[10px] text-muted-foreground">Use an invite code</div>
          </button>
        </div>
      </div>

      {orgAction === 'create' ? (
        <div className="space-y-2">
          <Label htmlFor="org_name">Organisation name</Label>
          <Input id="org_name" type="text" placeholder="e.g. YALLO Academy" {...register('org_name')} />
          {errors.org_name && <p className="text-xs text-destructive">{errors.org_name.message}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="invite_code">Invite code</Label>
          <Input id="invite_code" type="text" placeholder="Paste your invite code" {...register('invite_code')} />
          {errors.invite_code && <p className="text-xs text-destructive">{errors.invite_code.message}</p>}
        </div>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending && <Loader2 className="animate-spin" />}
        Finish setup
      </Button>
    </form>
  );
}
