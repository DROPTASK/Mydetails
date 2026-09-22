import { AssetList } from "./AssetList";
export function Gallery() {
  return <AssetList type="photo" title="Gallery" empty="No photos yet. Add image URLs in admin." />;
}
