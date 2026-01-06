import { View, Text, SafeAreaView, Pressable } from "react-native";
import { Upload as UploadIcon, Camera, FileText, Info } from "lucide-react-native";

export default function Upload() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-8 py-12">
        <View className="items-center mb-12">
          <View className="w-20 h-20 bg-primary-light/30 rounded-full items-center justify-center mb-6">
            <UploadIcon size={40} color="#923D5C" />
          </View>
          <Text className="text-3xl font-inter-bold text-secondary-dark mb-3">Add Test Result</Text>
          <Text className="text-text-light font-inter-regular text-center">
            Choose how you want to add your new test result.
          </Text>
        </View>

        <View className="gap-6">
          <UploadOption 
            icon={<Camera size={28} color="#923D5C" />}
            title="Take a Photo"
            description="Use your camera to capture a result document"
          />
          <UploadOption 
            icon={<FileText size={28} color="#923D5C" />}
            title="Upload PDF/Image"
            description="Select a file from your device storage"
          />
        </View>

        <View className="mt-auto bg-primary-light/20 p-5 rounded-3xl flex-row items-start">
          <Info size={20} color="#923D5C" />
          <Text className="ml-3 flex-1 text-primary-dark font-inter-medium text-sm leading-5">
            Discloser will automatically parse your results. You'll have a chance to review and edit before saving.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function UploadOption({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Pressable className="bg-white p-6 rounded-3xl border border-border shadow-sm flex-row items-center active:bg-gray-50 mb-4">
      <View className="bg-gray-50 p-4 rounded-2xl mr-5">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-lg font-inter-semibold text-text mb-1">{title}</Text>
        <Text className="text-text-light font-inter-regular text-sm">{description}</Text>
      </View>
    </Pressable>
  );
}
