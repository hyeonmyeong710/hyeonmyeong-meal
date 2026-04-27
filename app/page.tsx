import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-neutral-500">현명한 한끼</p>

          <h1 className="text-3xl font-bold text-neutral-900">
            지금 만들 수 있는 한 끼를
            <br />
            쉽게 찾으세요
          </h1>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <Link
            href="/ingredients"
            className="rounded-2xl bg-black px-5 py-5 text-center text-lg font-bold text-white"
          >
            재료로 찾기
          </Link>

          <Link
            href="/recipes"
            className="rounded-2xl border border-neutral-200 px-5 py-5 text-center text-lg font-bold text-black"
          >
            레시피 둘러보기
          </Link>

          <Link
            href="/login"
            className="pt-4 text-center text-sm font-semibold text-neutral-400"
          >
            관리자 로그인
          </Link>
        </div>
      </div>
    </main>
  );
}