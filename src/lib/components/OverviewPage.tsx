import { ImageItem } from '../models';
import $ from './OverviewPage.module.scss';
import Button from './Button';
import openFileInExplorer from '../utils/openFileInExplorer';

type Props = {
  images: ImageItem[];
};

export default function OverViewPage({ images }: Props) {
  return (
    <div className={$.container}>
      {images.map((item, index) => {
        return (
          <div key={item.id} className={$.item}>
            <img src={item.imageSrc} alt={`Image ${index}`} />
            <Button onClick={() => openFileInExplorer(item.path)}>
              Open in folder
            </Button>
          </div>
        );
      })}
    </div>
  );
}
