import { Article } from "@/lib/articles";
import Link from "next/link";

interface Props {
  article: Article;
}

export default function ArticleCard({ article }: Props) {
  return (
    <Link href={`/articles/${article.slug}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {article.category}
              </span>
              <span className="text-xs text-gray-400">{article.readTime}</span>
            </div>
            <h3 className="font-bold text-gray-900 leading-tight mb-2 group-hover:text-indigo-700 transition-colors font-serif">
              {article.title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {article.preview}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs text-gray-400">
                {article.author} &middot; {article.date}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-lg font-bold text-gray-900">$0.01</div>
            <div className="text-xs text-gray-400">per read</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
