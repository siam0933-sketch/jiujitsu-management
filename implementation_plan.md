# Member Management UI Enhancements

## Goal
Update the Member Management table to include Age, Belt, and Next Payment Date columns, with visual status indicators for payment dues.

## Features
1.  **New Columns**:
    -   **Age (나이)**: Calculated as **Korean Age** (Current Year - Birth Year + 1).
    -   **Belt (벨트/등급)**: Direct display of `belt` field.
    -   **Next Payment Date (다음 결제일)**: Calculated based on `payment_end_date` (if available) or `payment_due_day`.
2.  **Payment Status Logic**:
    -   **Target Date Determination**:
        -   If `payment_end_date` exists: Use it.
        -   If not, calculate `currentMonth-dueDay`.
    -   **Status**:
        -   **Unpaid (미납)**: If Today > Target Date + 1 day.
        -   **Payment Due (결제예정)**: If Target Date - 5 days <= Today <= Target Date.
        -   **Normal**: Otherwise.

## Implementation Details

### `app/dashboard/members/components/MembersTable.tsx`
-   **Helper Functions**:
    -   `calculateAge(birthDate: string)`: Returns `TodayYear - BirthYear + 1` (Korean Age).
    -   `getPaymentStatus(member: Member)` returns `{ status: 'unpaid' | 'due' | 'normal', date: Date }`
-   **Table Structure**:
    -   Add `<th>` for Age, Belt, Next Payment.
    -   Add `<td>` rendering the helpers.
    -   Add badges:
        -   Unpaid: Red text/bg.
        -   Due: Yellow/Orange text/bg.

## Verification
-   **Manual Test**:
    1.  Refresh Members Page.
    2.  Check columns.
    3.  Verify Age logic.
    4.  Verify Payment Status by observing members with different `payment_due_day` or `payment_end_date`.
