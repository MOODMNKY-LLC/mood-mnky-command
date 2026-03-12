"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  FileText,
  BookOpen,
  ArrowRightLeft,
  ExternalLink,
  Globe,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function StoreContentPage() {
  const [tab, setTab] = useState("pages")

  const { data: pagesData, isLoading: pagesLoading, mutate } = useSWR(
    "/api/shopify/content?type=pages",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: blogsData, isLoading: blogsLoading } = useSWR(
    "/api/shopify/content?type=blogs",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: redirectsData, isLoading: redirectsLoading } = useSWR(
    "/api/shopify/content?type=redirects",
    fetcher,
    { revalidateOnFocus: false }
  )

  const pages = pagesData?.pages || []
  const blogs = blogsData?.blogs || []
  const redirects = redirectsData?.redirects || []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Content
          </h1>
          <p className="text-sm text-muted-foreground">
            Pages, blog posts, and URL redirects
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} className="bg-transparent">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <FileText className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Pages</span>
              <span className="text-lg font-mono font-semibold text-foreground">
                {pagesData?.count ?? pages.length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Blogs</span>
              <span className="text-lg font-mono font-semibold text-foreground">
                {blogs.length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Redirects</span>
              <span className="text-lg font-mono font-semibold text-foreground">
                {redirects.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="blogs">Blog Posts</TabsTrigger>
          <TabsTrigger value="redirects">Redirects</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {pagesLoading ? (
                <div className="flex flex-col gap-3 p-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : pages.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <FileText className="h-8 w-8" />
                  <p className="text-sm">No pages found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Handle</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pages.map(
                      (page: {
                        id: number
                        title: string
                        handle: string
                        author: string
                        published_at: string | null
                        updated_at: string
                      }) => (
                        <TableRow key={page.id}>
                          <TableCell className="text-sm font-medium text-foreground">
                            {page.title}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            /{page.handle}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {page.author}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-[10px] border-0 ${
                                page.published_at
                                  ? "bg-success/10 text-success"
                                  : "bg-warning/10 text-warning"
                              }`}
                            >
                              {page.published_at ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(page.updated_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
                              <a
                                href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || ""}/admin/pages/${page.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blogs" className="mt-4">
          {blogsLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <BookOpen className="h-8 w-8" />
                <p className="text-sm">No blogs found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {blogs.map(
                (blog: {
                  id: number
                  title: string
                  handle: string
                  articles?: Array<{
                    id: number
                    title: string
                    author: string
                    published_at: string | null
                    tags: string
                  }>
                }) => (
                  <Card key={blog.id} className="bg-card border-border">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-foreground">
                          {blog.title}
                        </CardTitle>
                        <Badge variant="secondary" className="text-[10px]">
                          {blog.articles?.length || 0} articles
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {blog.articles && blog.articles.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {blog.articles.map((article) => (
                            <div
                              key={article.id}
                              className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm text-foreground">
                                  {article.title}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{article.author}</span>
                                  {article.published_at && (
                                    <>
                                      <span className="text-border">|</span>
                                      <span>
                                        {new Date(article.published_at).toLocaleDateString()}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Badge
                                className={`text-[10px] border-0 ${
                                  article.published_at
                                    ? "bg-success/10 text-success"
                                    : "bg-warning/10 text-warning"
                                }`}
                              >
                                {article.published_at ? "Published" : "Draft"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No articles yet</p>
                      )}
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="redirects" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {redirectsLoading ? (
                <div className="flex flex-col gap-3 p-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : redirects.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <ArrowRightLeft className="h-8 w-8" />
                  <p className="text-sm">No redirects configured</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redirects.map(
                      (redirect: { id: number; path: string; target: string }) => (
                        <TableRow key={redirect.id}>
                          <TableCell className="text-sm font-mono text-foreground">
                            {redirect.path}
                          </TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">
                            {redirect.target}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
