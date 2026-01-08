import React from "react";

type AddressProps = {
  address?: string;
  chain?: any; // kept generic for now; can be typed to viem's Chain
  blockExplorerAddressLink?: string;
  className?: string;
};

export const Address: React.FC<AddressProps> = ({ address, blockExplorerAddressLink, className }) => {
  if (!address) {
    return <span className={className}>-</span>;
  }

  if (blockExplorerAddressLink) {
    return (
      <a href={blockExplorerAddressLink} target="_blank" rel="noopener noreferrer" className={className}>
        {address}
      </a>
    );
  }

  return <span className={className}>{address}</span>;
};
