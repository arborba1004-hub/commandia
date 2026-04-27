const [emojis, setEmojis] = useState([]);

useEffect(() => {
  fetch('/emojis')
    .then((r) => r.json())
    .then(setEmojis);
}, []);

return (
  <div>
    {emojis.map((e) => (
      <button
        key={e.id}
        onClick={() => onSelectEmoji(e.shortcode)}
      >
        <img src={e.imageUrl} alt={e.label} />
      </button>
    ))}
  </div>
);