export function formatEnum(value: string | null | undefined): string {
    if (!value) return 'N/A';

    // Specific overrides
    const overrides: Record<string, string> = {
        // Funding Status
        'pre_seed': 'Pre-Seed',
        'series_a': 'Series A',
        'series_b_plus': 'Series B or later',

        // Team Size
        'size_1_10': '1-10 Employees',
        'size_11_50': '11-50 Employees',
        'size_51_200': '51-200 Employees',
        'size_200_plus': '200+ Employees',

        // Tax Status
        'us_person_w9': 'US Person (W9)',
        'foreign_contractor_w8ben': 'Foreign Contractor (W-8BEN)',

        // Availability
        'actively_looking': 'Actively Looking',
        'open_to_offers': 'Open to Offers',
    };

    if (overrides[value]) {
        return overrides[value];
    }

    // Default formatting: replace underscores with spaces and title case
    return value
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
