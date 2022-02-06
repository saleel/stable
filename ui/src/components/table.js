function Table(props) {
  const {
    data = [], fields = {}, labels={}
  } = props;

  return (
    <table className="table price-table">
      <thead>
        <tr className="">
          {Object.keys(fields).map((f) => (
            <th key={f}>{labels[f] || f}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((d) => (
          <tr key={d.id}>
            {Object.entries(fields).map(([fieldName, resolver]) => (
              <td>{typeof resolver === 'function' ? resolver(d[fieldName], d) : d[fieldName] }</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;
