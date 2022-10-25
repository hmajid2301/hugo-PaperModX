const faunadb = require('faunadb');
exports.handler = async (event) => {
  const contxt = process.env.CONTEXT
  const q = faunadb.query;
  const client = new faunadb.Client({
    secret: process.env.FAUNA_API_KEY,
  });
  const data = JSON.parse(event.body)
  // const isStaging = contxt==="branch-deploy"?true:false;
  // const index = isStaging?'collection_stage':'collection_prod'
  // const db = isStaging?'index_stage':'index_prod'

  const index = "likes_by_slug";
  const db = "likes";
  const slug = data.slug;
  const isIncrementLiked = data.increment;
  if (!slug) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Article slug not provided',
      }),
    };
  }
  const doesDocExist = await client.query(
    q.Exists(q.Match(q.Index(index), slug))
  );
  
  if (!doesDocExist) {
    await client.query(
      q.Create(q.Collection(db), {
        data: { slug: slug, likes: 1 },
      })
    );
  }
  
  const document = await client.query(
    q.Get(q.Match(q.Index(index), slug))
  );
  
  let newLikes = document.data.likes
  if (isIncrementLiked) {
    newLikes += 1
  } else {
    newLikes -= 1
  }

  await client.query(
    q.Update(document.ref, {
      data: {
        likes: newLikes,
      },
    })
  );
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      likes: newLikes,
    }),
  };
};