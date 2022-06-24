import Link from 'next/link'

export default function IndexPage() {
  return (
    <div className="main">
      <Link href="/timeScale">
        <a>Birds Example</a>
      </Link>
      <Link href="/boxes">
        <a>Boxes Example</a>
      </Link>
    </div>
  )
}
