"use client"

import { useRef, useState } from "react"

import { Input } from "@nextui-org/react"

export default function Searchbar({
  value,
  setValue,
  placeholder,
}: {
  value: string
  setValue: (value: string) => void
  placeholder: string
}) {
  const [searchValue, setSearchValue] = useState(value)

  //? Debounce the search
  const debounce = useRef<NodeJS.Timeout>()
  const onValueChange = (value: string) => {
    setSearchValue(value)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => setValue(value), 200)
  }

  return (
    <Input
      placeholder={placeholder}
      onValueChange={onValueChange}
      value={searchValue}
      className="w-[300px] min-w-[250px]"
      size="sm"
    />
  )
}
