interface Props {
  chapter?: number;
  meta: string;
  title: string;
}

export function ChapterIntro({ meta, title }: Props) {
  return (
    <>
      <div className="chapter-meta">{meta}</div>
      <h1>{title}</h1>
    </>
  );
}
