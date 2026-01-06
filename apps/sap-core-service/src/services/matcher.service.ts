import prisma from "../config/db";

export async function runVulnerabilityScan() {
    // We use a raw SQL query to join tables directly in the database.
    // This runs in milliseconds instead of minutes.
    const matches = await prisma.$queryRaw`
        INSERT INTO "SapVulnerability" (
            "id",
            "systemId",
            "componentName",
            "componentVersion",
            "noteId",
            "noteNumber",
            "fromVersion",
            "toVersion",
            "detectedAt"
        )
        SELECT
            gen_random_uuid(),      -- Generate new ID
            s."sid",                -- System ID
            ac."component",         -- Component Name
            ac."release",           -- Installed Version
            sn."id",                -- Note ID
            sn."noteNumber",        -- Note Number
            snc."fromVersion",      -- Vulnerable From
            snc."toVersion",        -- Vulnerable To
            NOW()                   -- Current Time
        FROM "AbapComponent" ac
        -- Join System to ensure it exists
        JOIN "System" s ON ac."systemSid" = s."sid"
        -- Join Note Components where names match
        JOIN "SapNoteComponent" snc ON ac."component" = snc."component"
        -- Join Note Details
        JOIN "SapNote" sn ON snc."noteId" = sn."id"
        -- THE MATCHING LOGIC: Check if version is within range
        WHERE
            ac."release" >= snc."fromVersion"
            AND ac."release" <= snc."toVersion"
        -- Avoid duplicates
        ON CONFLICT ("systemId", "componentName", "noteId") DO NOTHING;
    `;

    // Return a simple count (Prisma raw query result usually includes row count)
    return { status: "scanned", message: "Vulnerability scan completed via DB" };
}