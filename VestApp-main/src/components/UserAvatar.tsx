import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface UserAvatarProps {
  uid: string;
  size?: string | number;
  className?: string;
  fallbackName?: string;
  fallbackPhoto?: string;
  email?: string;
  avatarEdited?: boolean;
  style?: React.CSSProperties;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  uid,
  size = "40px",
  className = "",
  fallbackName = "Estudante",
  fallbackPhoto,
  email: propEmail,
  avatarEdited: propAvatarEdited,
  style,
}) => {
  const [photo, setPhoto] = useState<string | null>(fallbackPhoto || null);
  const [name, setName] = useState<string>(fallbackName);
  const [avatarEdited, setAvatarEdited] = useState<boolean | null>(
    propAvatarEdited !== undefined ? propAvatarEdited : null,
  );
  const [email, setEmail] = useState<string | null>(propEmail || null);

  useEffect(() => {
    if (fallbackPhoto) setPhoto(fallbackPhoto);
  }, [fallbackPhoto]);

  useEffect(() => {
    if (fallbackName) setName(fallbackName);
  }, [fallbackName]);

  useEffect(() => {
    if (propAvatarEdited !== undefined) setAvatarEdited(propAvatarEdited);
  }, [propAvatarEdited]);

  useEffect(() => {
    if (propEmail !== undefined) setEmail(propEmail);
  }, [propEmail]);

  useEffect(() => {
    if (!uid) return;

    // Skip fetching if everything is supplied in the props
    if (
      propEmail !== undefined &&
      propAvatarEdited !== undefined &&
      fallbackPhoto !== undefined
    ) {
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setPhoto(data.photoURL || null);
          if (data.displayName) setName(data.displayName);
          if (data.email) setEmail(data.email);
          if (data.avatarEdited !== undefined) {
            setAvatarEdited(data.avatarEdited);
          }
        }
      },
      (e) => {
        console.error("Error watching avatar profile:", e);
      }
    );

    return () => unsubscribe();
  }, [uid, propEmail, propAvatarEdited, fallbackPhoto]);

  const isMascot = uid === "vestapp_official_mascot";
  const currentPhoto = photo || fallbackPhoto;
  const currentAvatarEdited =
    propAvatarEdited !== undefined ? propAvatarEdited : (avatarEdited ?? false);
  const currentEmail = propEmail || email;

  const isGmailEmail = currentEmail
    ? currentEmail.toLowerCase().endsWith("@gmail.com")
    : false;
  const isGooglePhoto =
    currentPhoto?.includes("googleusercontent.com") || false;
  const isManualOrNonGmail = !isGmailEmail || !isGooglePhoto;

  const isRealPhoto =
    currentPhoto &&
    currentPhoto !== "" &&
    !currentPhoto.includes("picsum.photos") &&
    !currentPhoto.includes("api.dicebear.com") &&
    !currentPhoto.includes("ui-avatars.com");

  const isBase64 = currentPhoto?.startsWith("data:") || false;

  const hasPhoto = !!(isBase64 || isRealPhoto || isMascot);

  if (!hasPhoto) {
    return (
      <svg
        viewBox="0 0 100 100"
        style={{ width: size, height: size, borderRadius: "50%", ...style }}
        className={`${className} bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 p-0 shrink-0`}
        aria-label={name}
      >
        {/* Outer Ring */}
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
        />
        {/* Head */}
        <circle cx="50" cy="38" r="14" fill="currentColor" />
        {/* Torso */}
        <path
          d="M 20,74 C 20,58 32,56 50,56 C 68,56 80,58 80,74 C 72,83 62,88 50,88 C 38,88 28,83 20,74 Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <img
      src={currentPhoto || ""}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        ...style,
      }}
      className={className}
      alt={name}
      referrerPolicy="no-referrer"
    />
  );
};

export default UserAvatar;
