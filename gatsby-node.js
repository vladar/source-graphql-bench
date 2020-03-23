const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.createPages = async ({ graphql, actions, cache }) => {
  const { createPage } = actions

  const blogPost = path.resolve(`./src/templates/blog-post.js`)
  const query = `
      query ($cursor: String) {
        cms {
          posts(first:100 after: $cursor) {
            edges {
              node {
                slug: id
              }
              cursor
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `

  const CACHE_KEY = `slugs_here`
  const slugs = await cache.get(CACHE_KEY) || []

  if (!slugs.length) {
    // Create blog posts pages.
    let result
    let count = 0
    let cursor = null
    do {
      result = await graphql(query, { cursor })

      if (result.errors) {
        throw result.errors
      }

      const posts = result.data.cms.posts.edges

      posts.forEach((post, index) => {
        slugs.push(post.node.slug)
        cursor = post.cursor
        count++
      })
      console.log(`Fetch slugs`, count)
    } while (result.data.cms.posts.pageInfo.hasNextPage && count < 100)
    cache.set(CACHE_KEY, slugs)
  } else {
    console.log(`Slugs from cache: `, slugs.length)
  }

  console.log(`unique slugs: `, [... new Set(slugs) ].length)

  slugs.forEach((slug, index) => {
    const previous = index === slugs.length - 1 ? null : slugs[index + 1]
    const next = index === 0 ? null : slugs[index - 1]

    createPage({
      path: slug,
      component: blogPost,
      context: {
        slug,
        previous,
        next,
      },
    })
  })
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}
