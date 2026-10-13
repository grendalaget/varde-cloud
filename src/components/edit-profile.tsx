"use client";

import {
  Alert,
  Button,
  Input,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

// Inline editor for the Profile card — name (and optional avatar URL) go
// through better-auth's /update-user endpoint; email stays read-only.
export function EditProfile({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [newImage, setNewImage] = useState(image ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setErr(null);
    const img = newImage.trim();
    if (img && !/^(https?:\/\/|\/)\S+$/i.test(img)) {
      setErr("Avatar must be a full URL (https://…) or a path starting with /");
      setBusy(false);
      return;
    }
    try {
      const res = await authClient.updateUser({
        name: newName.trim(),
        image: img || null,
      });
      if (res.error) {
        setErr(res.error.message ?? "Could not save your profile");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setErr("Could not save your profile");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-muted">Name</dt>
            <dd className="mt-0.5 text-foreground">{name || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="mt-0.5 text-foreground">{email}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <Button
            variant="tertiary"
            size="sm"
            onPress={() => {
              setNewName(name);
              setNewImage(image ?? "");
              setErr(null);
              setOpen(true);
            }}
          >
            Edit profile
          </Button>
        </div>
      </>
    );
  }

  return (
    <form
      className="mt-4 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <TextField value={newName} onChange={setNewName} isRequired>
        <Label>Name</Label>
        <Input placeholder="Your name" />
      </TextField>
      <TextField value={newImage} onChange={setNewImage}>
        <Label>Avatar URL</Label>
        <Input placeholder="https://… (optional)" />
      </TextField>
      <div>
        <p className="text-sm text-muted">Email</p>
        <p className="mt-0.5 text-sm text-foreground">{email}</p>
      </div>
      {err ? (
        <Alert status="danger" role="alert">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{err}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <div className="flex gap-3">
        <Button type="submit" size="sm" isPending={busy} isDisabled={!newName.trim()}>
          {busy ? <Spinner color="current" size="sm" /> : null}
          Save
        </Button>
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          isDisabled={busy}
          onPress={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
