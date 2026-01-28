
export default function PostJobPage() {
    return (
        <div className="flex h-[80vh] flex-col items-center justify-center rounded-xl border bg-white p-8 text-center shadow-sm">
            <div className="mb-4 rounded-full bg-blue-50 p-4">
                <span className="text-4xl">🤖</span>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-[#242424]">AI Job Assistant</h2>
            <p className="max-w-md text-gray-500">
                I'm here to help you create the perfect job description. Let's start a new session to define your requirements.
            </p>
            <button className="mt-8 rounded-md bg-[#242424] px-6 py-3 font-medium text-white hover:bg-[#242424]/90">
                Start New Conversation
            </button>
        </div>
    )
}
