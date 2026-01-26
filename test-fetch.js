// Quick test to see if fetch works
fetch('https://vision.googleapis.com/v1/images:annotate?key=AIzaSyBb3qm2asey116Sd5wIQ7BEeJTH4DHITQ4', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requests: [{
      image: { content: '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==' },
      features: [{ type: 'TEXT_DETECTION' }]
    }]
  })
})
  .then(r => r.json())
  .then(data => console.log('✅ Fetch works!', data))
  .catch(err => console.error('❌ Fetch failed:', err));
