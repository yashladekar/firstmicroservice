export type StackType = "ABAP" | "JAVA" | "CLIENT" | "UNKNOWN";

export function classifyStack(component: string): StackType {
    if (component.startsWith("SAP_")) return "ABAP";

    if (
        [
            "ENGINEAPI",
            "EP-BASIS",
            "PORTAL",
            "J2EE",
            "UME"
        ].some((c) => component.startsWith(c))
    ) {
        return "JAVA";
    }

    if (component.startsWith("BC-FES")) return "CLIENT";

    return "UNKNOWN";
}
