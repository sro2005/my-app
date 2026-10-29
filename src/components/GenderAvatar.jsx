import React from 'react';

const GENDER_LABELS = {
  female: 'Femenino',
  male: 'Masculino',
  non_binary: 'No binario',
  unspecified: 'Sin especificar'
};

const GenderAvatar = ({ gender = 'unspecified', size = 'default' }) => {
  const normalizedGender = Object.prototype.hasOwnProperty.call(GENDER_LABELS, gender)
    ? gender
    : 'unspecified';
  const label = GENDER_LABELS[normalizedGender];

  return (
    <svg
      className={`evh-gender-icon evh-gender-icon--${normalizedGender} evh-gender-icon--${size}`}
      viewBox="0 0 64 64"
      role="img"
      aria-label={`Icono de perfil: ${label.toLowerCase()}`}
      focusable="false"
    >
      <circle className="evh-gender-icon-orbit" cx="32" cy="32" r="29" fill="currentColor" opacity=".08" />
      {normalizedGender === 'female' ? (
        <>
          <path d="M17 28c0-12 6-20 15-20s15 8 15 20v12c0 4-3 7-7 7H24c-4 0-7-3-7-7Z" fill="currentColor" opacity=".76" />
          <ellipse cx="32" cy="25" rx="10" ry="12" className="evh-gender-icon-face" />
          <path d="M18 57c1-11 6-17 14-17s13 6 14 17Z" fill="currentColor" />
          <path d="M22 24c2-1 3-3 4-5 3 2 8 3 14 2-1-7-5-11-9-11-7 0-11 6-9 14Z" fill="currentColor" />
        </>
      ) : normalizedGender === 'male' ? (
        <>
          <path d="M20 22c0-9 5-15 12-15s12 6 12 15v4H20Z" fill="currentColor" />
          <ellipse cx="32" cy="26" rx="10" ry="12" className="evh-gender-icon-face" />
          <path d="M14 57c1-11 7-17 18-17s17 6 18 17Z" fill="currentColor" />
        </>
      ) : (
        <>
          <circle cx="32" cy="24" r="11" className="evh-gender-icon-face" />
          <path d="M13 57c1-11 7-17 19-17s18 6 19 17Z" fill="currentColor" />
        </>
      )}
      <path d="M25 32c2 2 4 3 7 3s5-1 7-3" fill="none" stroke="var(--evh-avatar-detail, #fff)" strokeWidth="1.6" strokeLinecap="round" opacity=".86" />
    </svg>
  );
};

export const getGenderLabel = (gender) => GENDER_LABELS[gender] || GENDER_LABELS.unspecified;

export default GenderAvatar;
