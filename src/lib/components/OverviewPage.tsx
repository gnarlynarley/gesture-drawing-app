import $ from './OverviewPage.module.scss';

type Props = {
  images: string[];
};

export default function OverViewPage({ images }: Props) {
  return (
    <div className={$.container}>
      {images.map((imageSrc, index) => {
        return (
          <div key={index} className={$.item}>
            <img src={imageSrc} alt={`Image ${index}`} />
          </div>
        );
      })}
    </div>
  );
}
