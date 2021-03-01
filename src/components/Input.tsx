import React from 'react';
import styled from '@emotion/styled';

type InputProps = {
  icon: string;
  placeholder: string;
};

const StyledInput = styled.input`
  background: #222c3c;
  border: var(--border-dark);
  box-sizing: border-box;
  border-radius: var(--border-radius);
  margin: 0.75rem;
  height: 36px;
  width: 240px;
  padding-left: 2rem;
`;

const Icon = styled.img`
  position: absolute;
  margin: 1.35rem 0 0 1.5rem;
`;

const Input = ({ icon, placeholder }: InputProps) => {
  return (
    <div>
      <Icon src={icon} />
      <StyledInput placeholder={placeholder} />
    </div>
  );
};

export default Input;
