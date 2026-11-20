// Initials and a stable hue for avatar placeholders.
export const initials = (u) => `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`;
export const hueFor = (name) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 17);
