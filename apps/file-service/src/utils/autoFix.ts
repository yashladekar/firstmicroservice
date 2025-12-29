export const fixString = (v: any): string | null => {
    if (!v) return null;
    if (typeof v === "string") return v.trim();
    return String(v).trim();
};

export const fixNumber = (v: any): number | null => {
    if (!v) return null;

    if (typeof v === "number") return v;
    const num = Number(v);

    return isNaN(num) ? null : num;
};

export const fixEmail = (v: any): string | null => {
    if (!v) return null;
    const s = fixString(v);

    if (s && s.includes("@")) return s;
    return null;
};
