import BookingPanel from "@/components/BookingPanel";

export const metadata = {
  title: "Reserve a date",
  description:
    "Check availability and reserve a detailing appointment. We take one vehicle a day and we come to you.",
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <main>
      <BookingPanel />
    </main>
  );
}
