export interface UpsertArticleBodyDto {
  id?: string

  author: string

  title: string

  content: string

  category: string

  abstract: string

  tags: string

  articleCover: string

  type: string

  originalUrl?: string

  status: string
}
