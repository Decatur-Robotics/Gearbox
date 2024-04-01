import Flex from "@/components/Flex";
import ImageUpload from "@/components/forms/ImageUpload";

export default function testing(props) {
  return (
    <Flex center={true} className="w-full">
      <ImageUpload data={{ image: "" }}></ImageUpload>
    </Flex>
  );
}
