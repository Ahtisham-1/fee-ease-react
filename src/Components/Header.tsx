export default function Header({
  setActiveView,
}: {
  setActiveView: (view: string) => void;
}) {
  return (
    <>
      <button onClick={() => setActiveView("parent")}>Parent</button>
      <button onClick={() => setActiveView("admin")}>Admin</button>
    </>
  );
}
