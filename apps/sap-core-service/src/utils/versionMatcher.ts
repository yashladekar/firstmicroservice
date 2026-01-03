function normalize(v?: string) {
    if (!v) return [];
    return v.split(".").map((n) => parseInt(n, 10));
}

export function isVersionInRange(
    installed: string,
    from?: string,
    to?: string
): boolean {
    const i = normalize(installed);
    const f = normalize(from);
    const t = normalize(to);

    const gte = f.length === 0 || compare(i, f) >= 0;
    const lte = t.length === 0 || compare(i, t) <= 0;

    return gte && lte;
}

function compare(a: number[], b: number[]) {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const x = a[i] ?? 0;
        const y = b[i] ?? 0;
        if (x > y) return 1;
        if (x < y) return -1;
    }
    return 0;
}
