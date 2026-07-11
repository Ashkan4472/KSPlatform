import type { FeedItem as FeedItemData } from "../lib/types";

const KSPLATFORM_URL = __KSPLATFORM_URL__;

function targetUrl(item: FeedItemData): string {
  if (item.kind === "post") return `${KSPLATFORM_URL}/posts/${item.post.slug}`;
  return `${KSPLATFORM_URL}/tweets/${item.tweet.id}`;
}

export function FeedItem({ item }: { item: FeedItemData }) {
  const entity = item.kind === "post" ? item.post : item.tweet;
  const title = item.kind === "post" ? item.post.title : item.tweet.body;
  const excerpt = item.kind === "post" ? item.post.excerpt : null;

  return (
    <a
      href={targetUrl(item)}
      target="_blank"
      rel="noreferrer"
      className="feed-item"
    >
      <p className="feed-item-title">{title}</p>
      {excerpt && <p className="feed-item-excerpt">{excerpt}</p>}
      <div className="feed-item-meta">
        <span>{entity.author.name}</span>
        {entity.tags.map((t) => (
          <span key={t.slug} className="feed-item-tag">
            #{t.name}
          </span>
        ))}
      </div>
    </a>
  );
}
